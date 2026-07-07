import json

with open('ad_dump.json', 'r') as f:
    data = json.load(f)

with open('ad_specs_utf8.txt', 'w', encoding='utf-8') as out:
    for sheet in data:
        out.write(f"\n--- SHEET: {sheet} ---\n")
        rows = data[sheet]
        for row in rows:
            for cell in row:
                coord = cell['coord']
                val = cell['value']
                form = cell['formula']
                if form is not None:
                    out.write(f"{coord} | FORMULA | {form} | VALUE: {val}\n")
                else:
                    try:
                        fval = float(val)
                        out.write(f"{coord} | INPUT   | {val}\n")
                    except:
                        out.write(f"{coord} | TEXT    | {val}\n")
