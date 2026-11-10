# 🗣️ Heb-TTS Piper Nikkud

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-API-green.svg)](https://flask.palletsprojects.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

שרת Text-to-Speech מקומי מבוסס Flask, המשלב את מודל הניקוד [Phonikud](https://github.com/thewh1teagle/phonikud) יחד עם מנוע הדיבור [Piper](https://github.com/rhasspy/piper) ליצירת הקראה חלקה, טבעית ומדויקת בטקסטים מעורבים (עברית ואנגלית).
הפרויקט נבנה כדי לשמש כ-Backend עבור תוסף דפדפן (Firefox Extension) להקראת טקסטים מהרשת.

## ✨ תכונות מרכזיות

- 🌐 **תמיכה דו-לשונית (Code-Switching):** זיהוי ופיצול אוטומטי של משפטים המכילים עברית ואנגלית, תוך שמירה מלאה על גבולות מילים ומניעת חיתוכים רובוטיים.
- 🧠 **נרמול פונטי מתקדם בעברית:** טיפול בבעיות ידועות של מודלי VITS בעברית:
  - המרה אוטומטית של קמץ-קטן וחולם חסר לחולם מלא תקני לפני ו' (למניעת הגיית "הַתַּכְנָה" במקום "הַתּוֹכְנָה").
  - מניעת פיצול הברות סופיות על ידי הסרת שווא נע מלאכותי בצרור עיצורים (למשל `tekset` -> `tekst`).
  - הפרדה פונטית ושימוש בעצור סדקי (Glottal Stop) למניעת חיבור מילים שגוי (למשל הפרדה ברורה בין "עצמאי" ל-"עם").
- ⚡ **הפקת אודיו מהירה ורציפה:** מחזיר קובץ `WAV` מחובר ומוכן לנגינה ישירות בתגובת ה-API.

## 🚀 התקנה והרצה

מומלץ להשתמש ב-`uv` לניהול סביבת העבודה והתקנת התלויות במהירות:

```powershell
# 1. יצירת סביבה וירטואלית והפעלתה
uv venv
.venv\Scripts\activate

# 2. התקנת התלויות
uv pip install -r requirements.txt
```
### 📥 הורדת המודלים
הפרויקט כולל סקריפט המוריד אוטומטית את מודל הניקוד ואת שני מודלי הדיבור (Piper) בגודל בינוני ישירות לתיקייה הראשית:

```powershell
python download_models.py
```
1. מודל ניקוד: `phonikud-1.0.int8.onnx`
2. מודל עברית (Piper): `he_IL-saspeech-medium.onnx` וקובץ ההגדרות `he_IL-saspeech-medium.onnx.json`
3. מודל אנגלית (Piper): `en_US-bryce-medium.onnx` וקובץ ההגדרות `en_US-bryce-medium.onnx.json`

### 🏃‍♂️ הפעלת השרת

```powershell
python -X utf8 server.py
```

השרת ירוץ ויאזין לבקשות בכתובת המקומית: `[http://127.0.0.1:5000](http://127.0.0.1:5000)`

## 💻 שימוש (דוגמת API)

ניתן לפנות לשרת באמצעות בקשת `POST` לכתובת `/tts`.
דוגמה לשליחת בקשה ב-PowerShell שמייצרת ומנגנת קובץ אודיו:

```powershell
\$body = @{ text = "התוכנה פועלת באופן עצמאי עם Firefox Extension וגם Flask Server להקראת טקסט" } | ConvertTo-Json
$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
Invoke-RestMethod -Uri "http://127.0.0.1:5000/tts" -Method Post -ContentType "application/json; charset=utf-8" -Body \$bytes -OutFile "output.wav"
start output.wav
```

## 📜 רישיון

פרויקט זה משוחרר תחת רישיון MIT. לפרטים נוספים, ראו את קובץ ה-[LICENSE](LICENSE).
