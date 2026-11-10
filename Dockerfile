# שימוש בתמונת Python קלה
FROM python:3.10-slim

# התקנת espeak-ng ברמת מערכת ההפעלה (נדרש עבור מנוע הפונמות)
RUN apt-get update && apt-get install -y espeak-ng && rm -rf /var/lib/apt/lists/*

# הגדרת תיקיית העבודה בתוך הקונטיינר
WORKDIR /app

# העתקת קובץ התלויות והתקנתן
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# העתקת שאר קבצי השרת והסקריפטים
COPY server.py download_models.py ./

# הורדת המודלים ישירות לתוך האימג' בעת הבנייה
RUN python download_models.py

# חשיפת פורט 5000
EXPOSE 5000

# פקודת ההפעלה של השרת
CMD ["python", "server.py"]
