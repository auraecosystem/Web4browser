language: ruby
rvm:
  - 2.6
  - 2.7
  - 3.0
install:
  - bundle install
script:
  - bundle exec rake test
after_success:
  - bundle exec rake coveralls:push
notifications:
  email:
    recipients:
      - kubulee.kl@gmail.com
    on_success: always
    on_failure: always
