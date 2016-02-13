---
layout: post
title: "Love Branching with Continuous Integration and Continuous Delivery"
date: 2016-02-10 22:11:21 +0530
content: "Branching with CI & CD"
comments: true
categories:
- Continuous Integration
- Continuous Deleivery
- Branching
- Git Workflow
---

I am writing this post after looking in lot of discussions and post
about the Continuous Integration and Continuous Deleivery. Finally, I conclude
that we can achieve a CI and CD using Git Feature branches also.

Here your targeted audience ask for the Web Application which can print
"Hello World" when you land on the web page. We follow agile methodology and
we will implement this project using CI and CD.

I am Python lover, so I am going to demonstrate a basic web application written
in Flask. As a Open Source project we want to upload this package to PyPi.

Here is the complete developement details:

* **For Development:** [Flask](http://flask.pocoo.org/)
* **For CI:** [Travis](https://travis-ci.org/)
* **For Test Env:** Own Host Machine
* **Deploy:** [PyPi](https://pypi.python.org/pypi)


Suppose I have 3 members in my team and we are working on different features.

Lets come to continuous integrations. If you look on the Git Workflow, each one
of us are working on our feaure branch. We use Travis CI, which will run all
your test on every branch you create, on creating a Pull request(PR) for your
`develop` branch of repository and also run tests on your develop branch when you
merge the PR.

I was working on `Feature-01` branch, now it got merged. Now the question is
how we can achieve the Continuous Delivery. That is the biggest problem, how
can we deploy it on our QA environment, beacause Travis is CI tool not the CD
tool.

Now we have 2 options:

* Use Docker Images and after every successful merge, deploy image to Docker
Hub using Travis and Shell Script

* Use Travis to deploy your artifacts on Amazon S3

I pick option 2. I will deploy my build artifacts to Amazon S3. Now in my QA
environment I will write a Ansible script to pull the artifacts and deploy it
to the QA environments. Now I can test my code in my QA environment.

Similary I can replicate this thing for further environments like Staging.
This will achieve the Continuous Delivery purpose.

Now we delivered our project using Feature Branch and proper testing.

**NOTE:** I will release my source code soon on GitHub and will provide the
link of the repository here.
