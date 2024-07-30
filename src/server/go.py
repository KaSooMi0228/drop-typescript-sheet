import smtplib

smtp = smtplib.SMTP('localhost', 587)
sender = 'from@fromdomain.com'
receivers = ['to@todomain.com']

message = """From: From Person <from@fromdomain.com>
To: To Person <to@todomain.com>
Subject: SMTP e-mail test

This is a test e-mail message.
"""

smtp.sendmail(sender, receivers, message)
