import openpyxl

wb = openpyxl.load_workbook('clarifier.xlsx', data_only=False)

def dump_sheet(sheet_name, out_file):
    ws = wb[sheet_name]
    out_file.write(f"=== SHEET: {sheet_name} ===\n")
    for row in ws.iter_rows():
        row_data = []
        for cell in row:
            if cell.value is not None:
                coord = cell.coordinate
                val = str(cell.value).replace('\n', ' ')
                row_data.append(f"{coord}: {val}")
        if row_data:
            out_file.write(" | ".join(row_data) + "\n")
    out_file.write("\n")

with open('clarifier_dump.txt', 'w', encoding='utf-8') as f:
    dump_sheet('2. Sec Clarifier Design', f)
    dump_sheet('3. Prim Clarif Design', f)
