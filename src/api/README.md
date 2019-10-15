# Content

The content for this application consists of a collection of markdown files, each with a YAML header containing meta data.

The application content is subdivided into **publications**. Each publication (e.g. a text book) consists:

- An index file containing meta data describing the publication itself, e.g. title, copyright owner.
- A collection of content files, e.g. one per book chapter, containing the subject material.

The grouping into publications is established through a file naming convention, as follows:

| Filename | Description |
| -------- | ----------- |
| `<publication>.index.md` | The index file of the publication. |
| `<publication>.<chapter>.md` | A content file for a particular chapter of the publication. |

**NPM Packages used:**

- YAML header (backend): https://www.npmjs.com/package/front-matter
- Markdown (frontend): https://www.npmjs.com/package/markdown-it

## Index File

An index file contains a YAML header with meta data describing the publication and its accessibility. Although an index file has an `.md` extension, it contains no markdown content.

| Field name | Type | Required? | Description |
| ---------- | ---- | --------- | ----------- |
| title | string | Yes | The title of the publication. |
| subtitle | string | No | An optional subtitle. |
| restricted | boolean | No | (default: `true`) Determines whether the publication is restricted to registered users or publically available. |

> TODO: add author, publication date and copyright owner? Any other fields?

Example: `avbpel.index.md`

```
---
title: Arabisch voor beginners 1
subtitle: Een werkboek voor de studie van het Modern Standaardarabisch.
restricted: false
---
```

## Content Files

Content files contain a YAML header followed by markdown content.

### YAML Header

| Field name | Type | Required? | Description |
| ---------- | ---- | --------- | ----------- |
| title | string | Yes | The title of the chapter. |
| subtitle | string | No | An optional subtitle. |
| restricted | boolean | No | Determines whether the chapter is restricted to registered users. Default: `true` | 

> Notes: 
> 1. Content files that have `restricted` set to `false` but that are part of a restricted publication will not be accessible through the frontend for non-registered users as the publication itself will not be listed on the frontend.
> 2. A chapter that is marked as `restricted` will not be accessible to non-registered users even if its corresponding publication is unrestricted.

When loading a new or updates content file, the backend scans its markdown content section for 'lemma tables'. Lemma tables are text tables in markdown format