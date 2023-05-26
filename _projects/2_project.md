---
layout: page
title: Stellar Sonification
description: Simple Sonification of Celestial Object G344-W11
img: assets/img/g344_w11.jpg
importance: 2
category: work
---

This project was inspired by the recent sonification of the Perseus Galaxy Cluster, which led to many conversations behind the production of the project. 

The focus was on building the foundation for sonification of stellar objects, where selection of tone is relatively arbitrary in this execution, does allow for a more robust method to be dropped into the already functioning project.

<center>
<iframe
    width="640"
    height="480"
    src="https://www.youtube.com/embed/vLZnCs6Lc04"
    frameborder="0"
    allow="encrypted-media"
    allowfullscreen
>
</iframe>
</center>

The image processing/pixel analysis was done within Processing, using Processing's Pixel class to analyze the spectral content of each pixel column, then translating that into an audible tone using SuperCollider's audio engine. This was done for each wavelength, provided within the original picture format, but can be extended to any arbitrary wavelength represented in the photo. 
