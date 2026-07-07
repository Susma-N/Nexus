import json

with open('ad_dump.json', 'r') as f:
    data = json.load(f)

for sheet in data:
    print(f"\n--- SHEET: {sheet} ---")
    rows = data[sheet]
    for row in rows:
        for cell in row:
            coord = cell['coord']
            val = cell['value']
            form = cell['formula']
            if form is not None:
                print(f"{coord} | FORMULA | {form} | VALUE: {val}")
            else:
                try:
                    fval = float(val)
                    print(f"{coord} | INPUT   | {val}")
                except:
                    print(f"{coord} | TEXT    | {val}")
