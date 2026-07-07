import openpyxl
wb = openpyxl.load_workbook('target_sheet.xlsx', data_only=False)
with open('named_ranges.txt', 'w', encoding='utf-8') as f:
    for name, defn in wb.defined_names.items():
        f.write(f"{name}: {defn.value}\n")
print("Dumped named ranges.")
