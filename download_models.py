import os
import urllib.request
import sys

# רשימת הקבצים הנדרשים והקישורים הישירים להורדה
MODELS = {
    # Phonikud
    "phonikud-1.0.int8.onnx": "https://huggingface.co/thewh1teagle/phonikud/resolve/main/phonikud-1.0.int8.onnx",
    
    # Piper Hebrew
    "he_IL-saspeech-medium.onnx": "https://huggingface.co/rhasspy/piper-voices/resolve/main/he/he_IL/saspeech/medium/he_IL-saspeech-medium.onnx",
    "he_IL-saspeech-medium.onnx.json": "https://huggingface.co/rhasspy/piper-voices/resolve/main/he/he_IL/saspeech/medium/he_IL-saspeech-medium.onnx.json",
    
    # Piper English
    "en_US-bryce-medium.onnx": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/bryce/medium/en_US-bryce-medium.onnx",
    "en_US-bryce-medium.onnx.json": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/bryce/medium/en_US-bryce-medium.onnx.json"
}

def report_progress(block_num, block_size, total_size):
    downloaded = block_num * block_size
    if total_size > 0:
        percent = downloaded * 100 / total_size
        sys.stdout.write(f"\rהורדה מתקדמת: {percent:.1f}% ({downloaded / (1024*1024):.1f} MB / {total_size / (1024*1024):.1f} MB)")
        sys.stdout.flush()

def download_files():
    print("מתחיל בהורדת קבצי המודלים הדרושים לפרויקט...\n")
    
    for filename, url in MODELS.items():
        if os.path.exists(filename):
            print(f"[קיים] הקובץ {filename} כבר נמצא בספרייה, מדלג.")
        else:
            print(f"[מוריד] מוריד את {filename}...")
            try:
                urllib.request.urlretrieve(url, filename, reporthook=report_progress)
                print("\n-> ההורדה הושלמה בהצלחה!\n")
            except Exception as e:
                print(f"\n-> שגיאה בהורדת הקובץ {filename}: {e}\n")

if __name__ == "__main__":
    download_files()
    print("כל הקבצים נבדקו/הורדו. אפשר כעת להפעיל את שרת ה-TTS.")
