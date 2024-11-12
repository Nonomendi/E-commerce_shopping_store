VERSION_FILE = pom.xml

.PHONY:
	run_script

run_script:
	$(shell chmod +x Script.sh)
	./Script.sh

# Tag the version number on git
tag:
	git tag release-$(shell grep -oPm1 "(?<=<version>)[^<]+" $(VERSION_FILE))
