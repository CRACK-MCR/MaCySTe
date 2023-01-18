.PHONY: install-mdbook build serve open push

MDBOOK := $(shell command -v mdbook || true)

install-mdbook:
	@[ -x "$(MDBOOK)" ] || cargo install mdbook

build: install-mdbook
	$(MDBOOK) build

serve: install-mdbook
	$(MDBOOK) serve --port 3000

open: install-mdbook
	$(MDBOOK) serve --port 3000 --open

push:
	rm -rf book
	$(MAKE) build
	cd book; git init; git branch -m website; git add -A; git commit -m "Automatic build $$(date -u)"; git remote add origin git@github.com:CRACK-MCR/MaCySTe.git; git push --force origin website
