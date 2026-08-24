import json,re,os,sys
root=os.path.dirname(__file__)
def read(p): return open(os.path.join(root,p),encoding="utf-8").read()
cards=json.loads(read("data/cards.js").split("=",1)[1].strip().rstrip(";"))
assert len(cards)==100 and len({c["name"] for c in cards})==100
assert all("Spell" not in c["type"] and "Trap" not in c["type"] for c in cards)
assert all(c.get("image","").startswith("images/") and not str(c.get("image","")).startswith("http") for c in cards)
app=read("app.js")
m=re.search(r'const JP_NAMES = (\{.*?\});',app,re.S); assert m
jp=json.loads(m.group(1)); assert all(c["name"] in jp and jp[c["name"]] for c in cards)
assert app.count("function submitHumanClue") == 1
assert "if(!game?.settings?.liePenalty) return true;" in app
assert "Boolean(onlineGame.settings.liePenalty)" in app
assert 'clientVersion:"v106"' in app
assert "ゲームバージョン v106" in read("index.html")
assert 'const expected = "v106"' in read("version-check.js")
missing=[c["name"] for c in cards if not os.path.isfile(os.path.join(root,c["image"]))]
if "--require-images" in sys.argv and missing: raise AssertionError("Missing images: "+", ".join(missing))
print(f"PASS: v106 / 100 unique monsters / JP names=100 / missing images={len(missing)}")
