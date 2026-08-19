import json,re,zipfile,os,sys
root=os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(root,"data","cards.js"),encoding="utf-8-sig") as f: txt=f.read().split("=",1)[1].strip().rstrip(";")
cards=json.loads(txt)
assert len(cards)==60, f"card count={len(cards)}"
for c in cards: assert c.get("name") and c.get("image"), c.get("name")
for rel in ["index.html","styles.css","app.js","version-check.js","version.json","BUILD_VERSION.txt","data/cards.js"]: assert os.path.exists(os.path.join(root,rel)), rel
assert open(os.path.join(root,"BUILD_VERSION.txt")).read().strip()=="v94"
assert json.load(open(os.path.join(root,"version.json")))['version']=="v94"
html=open(os.path.join(root,"index.html"),encoding="utf-8").read()
for ref in re.findall(r'(?:src|href)=["\']([^"\']+?)(?:\?[^"\']*)?["\']',html):
    if ref.startswith(('http:','https:','#','data:','mailto:')): continue
    if ref.lower().endswith(('.png','.jpg','.jpeg','.webp','.gif','.svg')): continue
    p=os.path.join(root,ref.split('?',1)[0])
    assert os.path.exists(p), f"missing asset {ref}"
print("PASS: v94, 60 cards, local asset references valid")
