check-git:
	git fetch --prune
	git branch -vv

cleanup-git:
	git branch -vv | awk '/: gone]/{print $1}' | xargs -r git branch -d
