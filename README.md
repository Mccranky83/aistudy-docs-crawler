# AiStudy Documents Crawler

<img src="https://github.com/user-attachments/assets/4b1bfcf1-8d6d-4844-8e74-c052b6282634" height="150" align="right"/>

This project encompasses a sophisticated web crawler engineered to systematically acquire educational resources from the [上海市中小学数字教学系统](https://sz-api.ai-study.net/).

> The crawler leverages Puppeteer, a Node.js library, to simulate human-like interactions with the Chromium browser, enabling the efficient extraction of download links.
> Subsequently, the tool employs the `curl` command-line utility to facilitate the recursive downloading of these resources to the local system.

## Installation

```bash
# Clone the repository
npm i # Installs project dependencies, including compatible Chrome
npm run start # Executes the start script, which runs `app/start.js`
```

## Example

**Crawl first**

<pre>
prompt> npm run start

Directly download or crawl first? (d/C) 
subjectIndex [1-25]: 1
Startup grade [Default: 0]: 
Offset [Default: 1]: 2
Startup semester [Default: 0]: 1
Offset [Default: 1]: 1
Startup unit [Default: 0]: 2
Offset [Default: 1]: 1000
Startup course [Default: 0]: 
Offset [Default: 1]: 
</pre>

**Direct download**

<pre>
prompt> npm run start

Directly download or crawl first? (d/C) d
劳动 - 6.json
sitemapName:
</pre>

**No available linkmaps**

<pre>
prompt> npm run start

Directly download or crawl first? (d/C) d
No linkmaps available!
</pre>

## Results

![Screenshot 2024-07-29 at 17 48 43](https://github.com/user-attachments/assets/f516517a-6561-4987-a64a-800955339ebf)
