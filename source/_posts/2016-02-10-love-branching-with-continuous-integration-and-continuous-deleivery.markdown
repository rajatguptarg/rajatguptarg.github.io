---
layout: post
title: "Love Branching with Continuous Integration and Continuous Deleivery"
date: 2016-02-10 22:11:21 +0530
content: "Branching with CI & CD"
comments: true
categories:
- Continuous Integration
- Continuous Deleivery
- Branching
- Git Workflow
---

**[Draft]**

I am writing this post after looking in lot of discussions and post
about the Continuous Integration and Continuous Deleivery. Finally, I conclude
that we can achieve a CI and CD using Git Feature branches also.

Here your targeted audience ask for the Web Application which can print
"Hello World" when you land on the web page. We follow agile methodology and
we will implement this project using CI and CD.

I am Python lover, so I am going to demonstrate a basic web application written
in Flask. As a Open Source project we want to upload this package to PyPi.

Here is the complete developement details:

* **For Development:** Flask
* **For CI:** Travis
* **For Test Env:** Own Host Machine
