rm -f book.pdf
rm -rf book-pdf
rm -rf review
mkdir review

ls src | awk  -F. '{print "docker run --rm -v \`pwd\`/.:/work nuitsjp/md2review /bin/sh -c \"cd /work && md2review src/" $1 "." $2 " > review/" $1 ".re\"" }' | bash
docker run --rm -v `pwd`/.:/work vvakame/review /bin/sh -c "cd /work && review-pdfmaker config.yml"
