from reportlab.pdfgen import canvas

text = """Artificial intelligence (AI) is the intelligence of machines or software, as opposed to the intelligence of human beings or animals.
AI applications include advanced web search engines, recommendation systems, understanding human speech, self-driving cars, and generative or creative tools.
Artificial intelligence was founded as an academic discipline in 1956.
Machine learning is the study of computer algorithms that improve automatically through experience.
Deep learning is a subset of machine learning that uses multi-layered artificial neural networks.
Natural language processing (NLP) is a subfield of linguistics, computer science, and artificial intelligence concerned with the interactions between computers and human language, in particular how to program computers to process and analyze large amounts of natural language data.
Computer vision is an interdisciplinary scientific field that deals with how computers can gain high-level understanding from digital images or videos.
Reinforcement learning is an area of machine learning concerned with how intelligent agents ought to take actions in an environment in order to maximize the notion of cumulative reward.
Generative AI refers to algorithms that can be used to create new content, including audio, code, images, text, simulations, and videos.
Supervised learning is the machine learning task of learning a function that maps an input to an output based on example input-output pairs.
Unsupervised learning is a type of machine learning that looks for previously undetected patterns in a data set with no pre-existing labels and with a minimum of human supervision.
"""

c = canvas.Canvas("valid_sample.pdf")
y = 800
lines = text.split("\n")
for line in lines:
    if len(line.strip()) == 0:
        continue
    # chunk line
    words = line.split(" ")
    chunk = ""
    for w in words:
        if len(chunk) + len(w) > 80:
            c.drawString(50, y, chunk)
            y -= 20
            chunk = w + " "
        else:
            chunk += w + " "
    if chunk:
        c.drawString(50, y, chunk)
        y -= 20

c.save()
