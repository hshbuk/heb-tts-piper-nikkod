# 🗣️ Heb-TTS Piper Nikkud

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-API-green.svg)](https://flask.palletsprojects.com/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

שרת Text-to-Speech מקומי מבוסס Flask, המשלב את מודל הניקוד [Phonikud](https://github.com/thewh1teagle/phonikud) יחד עם מנוע הדיבור [Piper](https://github.com/rhasspy/piper) ליצירת הקראה חלקה, טבעית ומדויקת בטקסטים מעורבים (עברית ואנגלית).
הפרויקט כולל תוסף דפדפן (Firefox Extension) עשיר המאפשר הקראת טקסטים מהרשת בקליק, כולל חלון ניהול מובנה לשליטה במהירות ההקראה.

## ✨ תכונות מרכזיות

- 🌐 **תמיכה דו-לשונית (Code-Switching):** זיהוי ופיצול אוטומטי של משפטים המכילים עברית ואנגלית, תוך שמירה מלאה על גבולות מילים.
- 🧠 **נרמול פונטי מתקדם בעברית:** 
  - המרה אוטומטית של קמץ-קטן וחולם חסר לחולם מלא תקני לפני ו' (למניעת הגיית "הַתַּכְנָה" במקום "הַתּוֹכְנָה").
  - מניעת פיצול הברות סופיות (הסרת שווא נע מלאכותי בצרור עיצורים סופי).
  - הפרדה פונטית ושימוש בעצור סדקי (Glottal Stop) למניעת היבלעות מילים (כמו "עצמאי עם").
- 🧩 **תוסף דפדפן חכם (Firefox):**
  - הזרמת משפטים וטעינה מראש (Pre-fetching) לאפס זמן המתנה בפסקאות ארוכות.
  - ממשק משתמש (Popup) לשליטה במהירות ההקראה וניגון.
  - תמיכה מלאה בקיצורי מקלדת להפעלה מהירה.

## 🚀 התקנה והרצה

מומלץ להשתמש ב-`uv` לניהול סביבת העבודה והתקנת התלויות במהירות:

```powershell
# 1. יצירת סביבה וירטואלית והפעלתה
uv venv
.venv\Scripts\activate

# 2. התקנת התלויות
uv pip install -r requirements.txt
```
### 🐳 שימוש ב-Docker (הדרך הקלה ביותר)

אם מותקן לכם Docker, אין צורך להתקין Python או להוריד מודלים ידנית. הכל מוכן מראש:

```powershell
# 1. בניית הקונטיינר (יוריד אוטומטית גם את כל המודלים)
docker build -t heb-tts-server .

# 2. הפעלת השרת
docker run -d -p 5000:5000 --name heb-tts heb-tts-server
```
השרת יהיה זמין כעת בכתובת `http://127.0.0.1:5000`.
לעצירת השרת: `docker stop heb-tts`.
### 📥 הורדת המודלים

הפרויקט כולל סקריפט המוריד אוטומטית את מודל הניקוד ואת שני מודלי הדיבור (Piper) בגודל בינוני ישירות לתיקייה הראשית:

```powershell
python download_models.py
```
*(הסקריפט יבדוק אם הקבצים כבר קיימים ויוריד רק את מה שחסר).*

### 🏃‍♂️ הפעלת השרת

```powershell
python -X utf8 server.py
```
השרת ירוץ ויאזין לבקשות בכתובת המקומית: `http://127.0.0.1:5000`

## 🧩 תוסף פיירפוקס (Firefox Extension)

כדי להשתמש בתוסף הדפדפן להקראה נוחה של טקסטים מהרשת:

1. ודא ששרת ה-Flask פועל ברקע.
2. פתח את Firefox והכנס לשורת הכתובת: `about:debugging#/runtime/this-firefox`
3. לחץ על הכפתור **Load Temporary Add-on...**
4. נווט לתיקיית `extension/` בתוך הפרויקט ובחר בקובץ `manifest.json`.

### 💡 איך להשתמש בתוסף?
- ⌨️ **קיצורי מקלדת:** סמן טקסט ולחץ `Alt + S` להתחלה/השהיה של ההקראה. לחץ `Alt + X` לעצירה מוחלטת.
- 🖱️ **קליק ימני:** סמן טקסט, לחץ קליק ימני בעכבר ובחר מתוך התפריט "🗣️ הקרא טקסט מסומן (Alt+S)".
- 🎛️ **חלון התוסף (Popup):** לחץ על סמל התוסף בסרגל הכלים העליון של הדפדפן כדי לשנות את מהירות ההקראה, לעצור או להשהות את הניגון.

## 💻 שימוש כ-API עצמאי

ניתן לפנות לשרת גם ישירות באמצעות בקשת `POST` לכתובת `/tts`. 
דוגמה לשליחת בקשה ב-PowerShell שמייצרת ומנגנת קובץ אודיו:

```powershell
\$body = @{ text = "התוכנה פועלת באופן עצמאי עם Firefox Extension וגם Flask Server להקראת טקסט" } | ConvertTo-Json
$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
Invoke-RestMethod -Uri "[http://127.0.0.1:5000/tts](http://127.0.0.1:5000/tts)" -Method Post -ContentType "application/json; charset=utf-8" -Body \$bytes -OutFile "output.wav"
start output.wav
```

## 📜 רישיון

פרויקט זה משוחרר תחת רישיון **GNU GPLv3**. 
המשמעות היא שאתם רשאים להשתמש, לשנות ולהפיץ את הקוד בחופשיות, אך כל פרויקט נגזר שמשתמש בקוד זה חייב להיות משוחרר גם הוא תחת אותו רישיון קוד פתוח. לפרטים נוספים, ראו את קובץ ה-[LICENSE](LICENSE).
