rm -f book.pdf
rm -rf book-pdf

ls src |grep -v "chap01.md"| awk  -F. '{print "docker run --rm -v `pwd`/.:/work nuitsjp/md2review /bin/sh -c \"cd /work && md2review src/" $1 "." $2 " --render-link-in-footnote > review/" $1 ".re\"" }' | bash 
find review -type f -name "*.re" |xargs sed -i -e "s/###scale=\(.*\)###/\]\[scale=\1/g"
docker run --rm -v `pwd`/.:/work vvakame/review /bin/sh -c "cd /work && review-pdfmaker config.yml"
