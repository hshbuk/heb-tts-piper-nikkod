import io
import os
import re
import wave
import builtins
import numpy as np

# הגדרת נתיבי espeak-ng לפני כל ייבוא אחר
import espeakng_loader
os.environ["PHONEMIZER_ESPEAK_LIBRARY"] = espeakng_loader.get_library_path()
os.environ["PHONEMIZER_ESPEAK_PATH"] = os.path.dirname(espeakng_loader.get_library_path())
os.environ["ESPEAK_DATA_PATH"] = espeakng_loader.get_data_path()

# עקיפת ברירת המחדל של Windows לפתיחת קבצי טקסט ב-UTF-8
_orig_open = builtins.open
def _utf8_open(*args, **kwargs):
    if len(args) > 1 and 'b' in str(args[1]):
        return _orig_open(*args, **kwargs)
    if 'mode' in kwargs and 'b' in kwargs['mode']:
        return _orig_open(*args, **kwargs)
    kwargs.setdefault('encoding', 'utf-8')
    return _orig_open(*args, **kwargs)

builtins.open = _utf8_open

from flask import Flask, request, send_file
from flask_cors import CORS
from phonikud_onnx import Phonikud
from piper.phonemize_hebrew import hebrew_to_ipa
from piper_onnx import Piper, phonemize

app = Flask(__name__)
CORS(app)

# מודלים
NKDN_MODEL = "phonikud-1.0.int8.onnx"
HEBREW_VOICE = "he_IL-saspeech-medium.onnx"
HEBREW_CONFIG = "he_IL-saspeech-medium.onnx.json"
ENGLISH_VOICE = "en_US-bryce-medium.onnx"
ENGLISH_CONFIG = "en_US-bryce-medium.onnx.json"

print("מאתחל מודלים מקומיים...")

try:
    nkdn = Phonikud(NKDN_MODEL)
    voice_he = Piper(HEBREW_VOICE, HEBREW_CONFIG)
    voice_en = Piper(ENGLISH_VOICE, ENGLISH_CONFIG)
    print("מודלי עברית ואנגלית נטענו בהצלחה!")
except Exception as e:
    print(f"\n[שגיאה בטעינת המודלים]: {e}\n")
    raise e

def normalize_hebrew_diacritics(text):
    """
    נרמול פונטי גנרי לעברית:
    1. הסרת טעמי מקרא, צינורות ומתגים.
    2. איחוד כל צורות חולם/קמץ-קטן לפני ו' לחולם מלא תקני (וֹ).
    3. המרת קמץ קטן שנותר לתנועת o (חולם).
    """
    clean = re.sub(r'[\u0591-\u05AF\u05BD\u05BF\u05C0\u05C4\u05C5|]', '', text)

    holam = chr(0x05B9)
    vav_holam = chr(0x05D5) + holam

    # תפיסת אות + שילוב כלשהו של דגש וקמץ-קטן/חולם לפני ו' -> הופך לחולם מלא
    clean = re.sub(r'([\u05D0-\u05EA])[\u05BC\u05B9\u05C7]*[\u05B9\u05C7][\u05BC\u05B9\u05C7]*\u05D5', r'\1' + vav_holam, clean)

    # המרת קמץ קטן שנותר לחולם
    clean = clean.replace(chr(0x05C7), holam)

    # מניעת חולם כפול
    clean = clean.replace(holam + holam, holam)

    return clean.strip()

def split_multilingual_text(text):
    """
    מפרק טקסט מעורב למקטעים רציפים תוך שמירה מלאה על גבולות מילים.
    """
    tokens = re.findall(r'[\u0590-\u05fe\d\.\,\?\!\:\;\-\"]+|[a-zA-Z\d\.\,\?\!\:\;\-\']+|\s+', text)
    
    chunks = []
    current_lang = None
    current_text = []

    for token in tokens:
        stripped = token.strip()
        if not stripped:
            if current_text:
                current_text.append(token)
            continue

        has_heb = bool(re.search(r'[\u0590-\u05fe]', stripped))
        has_eng = bool(re.search(r'[a-zA-Z]', stripped))

        lang = 'en' if has_eng else ('he' if has_heb else current_lang or 'he')

        if lang == current_lang:
            current_text.append(token)
        else:
            if current_text:
                chunks.append((current_lang, "".join(current_text).strip()))
            current_lang = lang
            current_text = [token]

    if current_text:
        chunks.append((current_lang, "".join(current_text).strip()))

    return [(lang, t) for lang, t in chunks if t]

def synthesize_segment(lang, text):
    if lang == 'en':
        phonemes = phonemize(text, language='en-us')
        audio_array, sample_rate = voice_en.create(
            phonemes, 
            is_phonemes=True,
            length_scale=1.12
        )
        audio_array = audio_array * 0.85
    else:
        vocalized = nkdn.add_diacritics(text)
        normalized = normalize_hebrew_diacritics(vocalized)
        phonemes = hebrew_to_ipa(normalized)

        # 1. הסרת שווא נע מלאכותי בצרור עיצורים בסוף מילה
        phonemes = re.sub(r'([kptsfʁχ])e([kptsfʁχ])\b', r'\1\2', phonemes)

        # 2. הארכת חולם מלא לפני עיצור ח' והזזת ההטעמה אליו כדי למנוע את "התכנה"
        phonemes = phonemes.replace("oχnˈa", "ˈoːχna").replace("oxnˈa", "ˈoːxna")

        # 3. הוספת עצור סדקי לפני מילים שמתחילות בתנועה (למניעת חיבור של עצמאי-עם)
        phonemes = re.sub(r' (ˈ?)([aeiou])', r' \1ʔ\2', phonemes)

        print(f"[Hebrew Raw]: {text}")
        print(f"[Normalized]: {normalized}")
        print(f"[Hebrew IPA]: {phonemes}")

        audio_array, sample_rate = voice_he.create(
            phonemes, 
            is_phonemes=True,
            length_scale=1.0
        )

    if audio_array.dtype != np.int16:
        audio_clamped = np.clip(audio_array, -1.0, 1.0)
        audio_pcm = (audio_clamped * 32767).astype(np.int16)
    else:
        audio_pcm = audio_array

    return audio_pcm, sample_rate

@app.route('/tts', methods=['POST'])
def process_tts():
    data = request.json or {}
    text = data.get('text', '').strip()

    if not text:
        return {"error": "No text provided"}, 400

    try:
        has_heb = bool(re.search(r'[\u0590-\u05fe]', text))
        has_eng = bool(re.search(r'[a-zA-Z]', text))

        if has_eng and not has_heb:
            pcm, sample_rate = synthesize_segment('en', text)
            final_pcm = pcm
            target_rate = sample_rate
        elif has_heb and not has_eng:
            pcm, sample_rate = synthesize_segment('he', text)
            final_pcm = pcm
            target_rate = sample_rate
        else:
            chunks = split_multilingual_text(text)
            print(f"[Mixed Chunks]: {chunks}")

            audio_parts = []
            target_rate = 22050
            pause_samples = int(target_rate * 0.02)
            pause_pcm = np.zeros(pause_samples, dtype=np.int16)

            for i, (lang, chunk_text) in enumerate(chunks):
                pcm, sr = synthesize_segment(lang, chunk_text)
                target_rate = sr
                audio_parts.append(pcm)
                if i < len(chunks) - 1:
                    audio_parts.append(pause_pcm)

            final_pcm = np.concatenate(audio_parts)

        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(target_rate)
            wav_file.writeframes(final_pcm.tobytes())

        buffer.seek(0)
        return send_file(buffer, mimetype="audio/wav")

    except Exception as e:
        print(f"שגיאה בזמן הפקת השמע: {e}")
        return {"error": str(e)}, 500

if __name__ == '__main__':
    print("\n=======================================")
    print("השרת מוכן ומאזין בפורט 5000 באופן מקומי!")
    print("=======================================\n")
    app.run(port=5000)