import sys
from PIL import Image
a,b,out=sys.argv[1],sys.argv[2],sys.argv[3]
seg=int(sys.argv[4]) if len(sys.argv)>4 else 1800
A=Image.open(a).convert('RGB'); B=Image.open(b).convert('RGB')
n=max((A.height+seg-1)//seg,(B.height+seg-1)//seg)
for i in range(n):
  ca=A.crop((0,i*seg,A.width,min(A.height,(i+1)*seg))) if i*seg<A.height else Image.new('RGB',(A.width,10))
  cb=B.crop((0,i*seg,B.width,min(B.height,(i+1)*seg))) if i*seg<B.height else Image.new('RGB',(B.width,10))
  W=700; ha=int(ca.height*W/ca.width); hb=int(cb.height*W/cb.width)
  M=Image.new('RGB',(W*2+10,max(ha,hb)),(255,0,0)); M.paste(ca.resize((W,ha)),(0,0)); M.paste(cb.resize((W,hb)),(W+10,0)); M.save(f"{out}-{i}.png")
print(n)
