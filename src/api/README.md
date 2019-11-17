# Content

The content for this application consists of a collection of markdown files, each with a YAML header containing meta data.

The application content is subdivided into **publications**. Each publication (e.g. a text book) consists:

- An index file containing meta data describing the publication itself, e.g. title, copyright owner.
- A collection of chapter files, e.g. one per book chapter, containing the subject material.

The grouping into publications is established through a file naming convention, as follows:

| Filename | Description |
| -------- | ----------- |
| `<publication>.index.md` | The index file of the publication. |
| `<publication>.<chapter>.md` | A chapter file from the publication. |

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
index: true
---
```

## Chapter Files

Chapter files contain a YAML header followed by markdown content.

### YAML Header

| Field name | Type | Required? | Description |
| ---------- | ---- | --------- | ----------- |
| title | string | Yes | The title of the chapter. |
| subtitle | string | No | An optional subtitle. |
| restricted | boolean | No | Determines whether the chapter is restricted to registered users. Default: `true` | 

Notes: 
1. Chapter files that have their `restricted` value set to `false` but that are part of a restricted publication will not be accessible through the frontend for non-registered users as the publication itself will not be listed on the frontend.
2. A chapter that is marked as `restricted` will not be accessible to non-registered users even if its corresponding publication is unrestricted.

When loading a new or updated chapter files, the backend scans its markdown content section for 'lemma tables'. Lemma tables are text tables in markdown format with a predefined header format and two required columns (`nl` and `ar`) and an optional third `roman` column. Example:

```
nl | ar | roman
---|---:|------
voor (vz. van plaats) | أَمَامَ | ʾamāma
onthouden, bewaren, uit het hoofd leren | حَفِظَ | ḥafiẓa
```

| Column header | Description |
| :-----------: | ----------- |
| nl | Dutch text |
| ar | Arabic translation |
| roman | Romanization of the Arabic translation |

The first two columns of a lemma table (i.e., `nl` and `ar`) are indexed and searchable through the frontend.
