import PyPDF2
import sys

with open('Cloud_Project_Proposal (2).pdf', 'rb') as f:
    reader = PyPDF2.PdfReader(f)
    for i, page in enumerate(reader.pages):
        print(f"\n=== PAGE {i+1} ===")
        text = page.extract_text()
        if text:
            print(text)
        else:
            print("[No text extracted from this page]")
