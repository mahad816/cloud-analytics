import fitz

doc = fitz.open('Cloud_Project_Proposal (2).pdf')
for page_num, page in enumerate(doc):
    print(f"\n--- Page {page_num + 1} ---\n")
    print(page.get_text())
