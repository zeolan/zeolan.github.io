### Install

bundle

bundle config path PATH_TO_INSTALL_RUBY

### Build

bundle exec jekyll build

### Run server

bundle exec jekyll serve

### Utils

check yaml files inside \_data directory:

python utils/yml_check.py \_data/

### How to config git credentials

git config --global credential.helper store
echo https://user:token@host >> ~/.git-credetials
