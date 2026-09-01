import json,re,os,sys
root=os.path.dirname(__file__)
def read(p): return open(os.path.join(root,p),encoding="utf-8").read()
cards=json.loads(read("data/cards.js").split("=",1)[1].strip().rstrip(";"))
assert len(cards)==100 and len({c["name"] for c in cards})==100
assert all("Spell" not in c["type"] and "Trap" not in c["type"] for c in cards)
assert all(c.get("image","").startswith("images/") and not str(c.get("image","")).startswith("http") for c in cards)
app=read("app.js")
rules=json.loads(read("firebase-database-rules.json"))
rooms=rules["rules"]["rooms"]["$roomId"]
private=rules["rules"].get("privateCards", {})
assert "privateCards" not in rooms
assert private["$roomId"]["$uid"][".read"] == "auth != null && auth.uid == $uid"
assert "rooms/${onlineRoomCodeValue}/privateCards/" not in app
assert "rooms/${roomCode}/privateCards/" not in app
assert "privateCards/${onlineRoomCodeValue}/${firebaseUid}" in app
assert "privateCards/${roomCode}/${firebaseUid}" in app
m=re.search(r'const JP_NAMES = (\{.*?\});',app,re.S); assert m
jp=json.loads(m.group(1)); assert all(c["name"] in jp and jp[c["name"]] for c in cards)
assert app.count("function submitHumanClue") == 1
assert "if(!game?.settings?.liePenalty) return true;" in app
assert "Boolean(onlineGame.settings.liePenalty)" in app
assert 'clientVersion:"v131"' in app
assert "ゲームバージョン v131" in read("index.html")
assert 'const expected = "v131"' in read("version-check.js")
missing=[c["name"] for c in cards if not os.path.isfile(os.path.join(root,c["image"]))]
if "--require-images" in sys.argv and missing: raise AssertionError("Missing images: "+", ".join(missing))
print(f"PASS: v131 / 100 unique monsters / JP names=100 / missing images={len(missing)}")
