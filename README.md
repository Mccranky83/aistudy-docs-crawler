# AiStudy Documents Crawler

<img src="https://www.researchgate.net/publication/338226442/figure/fig4/AS:852734349684736@1580319120217/Web-Crawler-Free-Icon-Available-from-Online-Web-Fonts.png" height="200" align="right"/>

This project encompasses a sophisticated web crawler engineered to systematically acquire educational resources from the [上海市中小学数字教学系统](https://sz-api.ai-study.net/).

> The crawler leverages Puppeteer, a Node.js library, to simulate human-like interactions with the Chromium browser, enabling the efficient extraction of download links.
> Subsequently, the tool employs the `curl` command-line utility to facilitate the recursive downloading of these resources to the local system.

## Installation

```bash
npm i # Installs project dependencies, including compatible Chrome
npm run start # Executes the start script, which runs `app/start.js`
```

## Example

**Crawl first**

<pre>
prompt> npm run start

Directly download or crawl first? (d/C)
subjectIndex [0-24]:
</pre>

**Direct download**

<pre>
prompt> npm run start

Directly download or crawl first? (d/C) d
劳动 - 6.json
sitemapName:
</pre>

## Results
