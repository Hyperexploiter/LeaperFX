
import os
from googletrans import Translator
from bs4 import BeautifulSoup
import PyPDF2
from fpdf import FPDF

def translate_text(text, dest_lang='fa'):
    if not text or text.isspace():
        return ""
    try:
        translator = Translator()
        translation = translator.translate(text, dest=dest_lang)
        return translation.text
    except Exception as e:
        return f"Error during translation: {e}"

def process_html_file(input_path, output_path):
    with open(input_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')

    for element in soup.find_all(string=True):
        if element.parent.name not in ['style', 'script', 'head', 'title', 'meta', '[document]']:
            translated_text = translate_text(element.string)
            element.string.replace_with(translated_text)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(str(soup))

def process_pdf_file(input_path, output_path):
    text = ""
    with open(input_path, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

    translated_text = translate_text(text)

    pdf = FPDF()
    pdf.add_page()
    try:
        pdf.add_font('GeezaPro', '', '/System/Library/Fonts/GeezaPro.ttc', uni=True)
        pdf.set_font('GeezaPro', '', 12)
    except Exception as e:
        print(f"Could not load GeezaPro font, falling back to Arial. Farsi text might not render correctly. Error: {e}")
        pdf.add_font('Arial', '', 'arial.ttf', uni=True)
        pdf.set_font('Arial', '', 12)


    pdf.multi_cell(0, 10, translated_text)
    pdf.output(output_path)

if __name__ == '__main__':
    html_files = [
        "/Users/hyperexploiter/PychymProjects/Leaper-Fx/leaperfx-contracts/public/terms.html",
        "/Users/hyperexploiter/PycharmProjects/Leaper-Fx/leaperfx-contracts/public/privacy.html",
        "/Users/hyperexploiter/PycharmProjects/Leaper-Fx/leaperfx-contracts/public/security.html"
    ]
    for file_path in html_files:
        dir_name, file_name = os.path.split(file_path)
        name, ext = os.path.splitext(file_name)
        output_path = os.path.join(dir_name, f"{name}_fa{ext}")
        try:
            process_html_file(file_path, output_path)
            print(f"Successfully translated {file_path} to {output_path}")
        except Exception as e:
            print(f"Failed to translate {file_path}. Error: {e}")

    pdf_files = [
        "/Users/hyperexploiter/PycharmProjects/Leaper-Fx/leaperfx-contracts/pdfs/LeaperFX_Complete_Contract_Package.pdf",
        "/Users/hyperexploiter/PycharmProjects/Leaper-Fx/leaperfx-contracts/pdfs/LeaperFX_Privacy_Policy.pdf",
        "/Users/hyperexploiter/PycharmProjects/Leaper-Fx/leaperfx-contracts/pdfs/LeaperFX_Terms_Roadmap.pdf"
    ]
    for file_path in pdf_files:
        dir_name, file_name = os.path.split(file_path)
        name, ext = os.path.splitext(file_name)
        output_path = os.path.join(dir_name, f"{name}_fa{ext}")
        try:
            process_pdf_file(file_path, output_path)
            print(f"Successfully translated {file_path} to {output_path}")
        except Exception as e:
            print(f"Failed to translate {file_path}. Error: {e}")
