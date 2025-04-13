---
title: "Python Program to Find the Sum of Natural Numbers"
date: 2025-04-13 14:00:00
author: "SajjadTalks"
summary: "Test Markdwon Code"
---

## Python Program to Find the Sum of Natural Numbers

In the program below, we've used an if...else statement in combination with a while loop to calculate the `sum` of natural numbers up to `num`.

``` python 


# Sum of natural numbers up to num

num = 16

if num < 0:
   print("Enter a positive number")
else:
   sum = 0
   # use while loop to iterate until zero
   while(num > 0):
       sum += num
       num -= 1
   print("The sum is", sum)

```