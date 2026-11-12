import sys
from PIL import Image
src,prefix=sys.argv[1],sys.argv[2]; seg=int(sys.argv[3]) if len(sys.argv)>3 else 1800
im=Image.open(src).convert('RGB'); W,H=im.size
n=0
for y in range(0,H,seg):
  c=im.crop((0,y,W,min(H,y+seg)))
  c=c.resize((W*2//3, c.height*2//3)); c.save(f"{prefix}-{n}.png"); n+=1
print(src,W,H,n)
