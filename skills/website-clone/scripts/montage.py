import sys
from PIL import Image
files=sys.argv[2:]; out=sys.argv[1]
ims=[Image.open(f).convert('RGB') for f in files]
w=480; h=int(ims[0].height*w/ims[0].width)
cols=3; rows=(len(ims)+cols-1)//cols
M=Image.new('RGB',(cols*w+(cols-1)*6,rows*h+(rows-1)*6),(255,0,0))
for i,im in enumerate(ims):
  M.paste(im.resize((w,h)),((i%cols)*(w+6),(i//cols)*(h+6)))
M.save(out)
