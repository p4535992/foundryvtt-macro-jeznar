# General Notes

Some of the things and commands that I have needed to learn and want to be able to find *next time.*

## grep

Command line grep, how I hate to love you...

To search my local repository, the following grep comamnd, run from the root of the repository file tree is useful:

> grep -ri --include=\\*.js cool-thing .

Elements of that:

1. **-r** causes grep to descend the tree
2. **-i** makes the serach case insensitive
1. **-include** limits the files that will be searched (to just .js in this case)
1. **'COOL-THING'** string that will be searched for
1. **.** is the location to begin the search

Sending the output through a pipe allows for additional filtering.  Something like the following can be useful:

> grep -ri --include=\\*.js 'COOL-THING' . | grep -i center

This will find just the lines that contain center and COOL-THING (or cool-thing, or any other mixed case variation)

[Additional grep info](https://www.cyberciti.biz/faq/howto-use-grep-command-in-linux-unix/#Syntax)

---

## Advanced Spell Effects

I just (2/25/22) ran across this module and I am blown away.  It does some awesome automation of spells, though it seems to toss a fair number of errors and has a hefty dependency list. I'm also a bit unnerved by the seemingly hidden changes it makes to spells, but for those that I haven't done, my gosh does it seem like easy mode to use and get a fancy result.

[Module Wiki (including dependencies)](https://github.com/Vauryx/AdvancedSpellEffects/wiki)

[Current Spells](https://github.com/Vauryx/AdvancedSpellEffects/wiki/Currently-Available-Spells#mirror-image)

---

[Link back to my Documentation Listing](README.md) 

[Link back to my Repo Listing](https://github.com/Jeznar/Jeznar/blob/main/README.md) 