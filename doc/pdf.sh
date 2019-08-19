rm -f book.pdf
rm -rf book-pdf
rm -rf review
mkdir review

docker run --rm -v `pwd`/.:/work nuitsjp/md2review /bin/sh -c "cd /work && md2review src/chap00.md > review/chap00.re"
docker run --rm -v `pwd`/.:/work nuitsjp/md2review /bin/sh -c "cd /work && md2review src/chap01.md > review/chap01.re"
docker run --rm -v `pwd`/.:/work vvakame/review /bin/sh -c "cd /work && review-pdfmaker config.yml"
