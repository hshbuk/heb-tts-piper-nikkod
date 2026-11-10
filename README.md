# 🗣️ Heb-TTS Piper Nikkud 

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-API-green.svg)](https://flask.palletsprojects.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

שרת Text-to-Speech מקומי מבוסס Flask, המשלב את מודל הניקוד [Phonikud](https://github.com/elazarg/phonikud) יחד עם מנוע הדיבור [Piper](https://github.com/rhasspy/piper) ליצירת הקראה חלקה, טבעית ומדויקת בטקסטים מעורבים (עברית ואנגלית). 
הפרויקט נבנה במקור כדי לשמש כ-Backend עבור תוסף דפדפן (Firefox Extension) להקראת טקסטים מהרשת.

## ✨ תכונות מרכזיות

* 🌐 **תמיכה דו-לשונית (Code-Switching):** זיהוי ופיצול אוטומטי של משפטים המכילים עברית ואנגלית, תוך שמירה מלאה על גבולות מילים ומניעת חיתוכים רובוטיים.
* 🧠 **נרמול פונטי מתקדם בעברית:** טיפול בבעיות ידועות של מודלי VITS בעברית:
  * המרה אוטומטית של קמץ-קטן וחולם חסר לחולם מלא תקני לפני ו' (למניעת הגיית "הַתַּכְנָה" במקום "הַתּוֹכְנָה").
  * מניעת פיצול הברות סופיות על ידי הסרת שווא נע מלאכותי בצרור עיצורים (למשל `tekset` -> `tekst`).
  * הפרדה פונטית ושימוש בעצור סדקי (Glottal Stop) למניעת חיבור מילים שגוי (למשל הפרדה ברורה בין "עצמאי" ל-"עם").
* ⚡ **הפקת אודיו מהירה ורציפה:** מחזיר קובץ `WAV` מחובר ומוכן לנגינה ישירות בתגובת ה-API.

## 🚀 התקנה והרצה

מומלץ להשתמש ב-`uv` לניהול סביבת העבודה והתקנת התלויות במהירות:

```powershell
# 1. יצירת סביבה וירטואלית והפעלתה
uv venv
.venv\Scripts\activate

# 2. התקנת התלויות
uv pip install -r requirements.txt
