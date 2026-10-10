# Books Directory

Place your EPUB and PDF books in this directory to have them appear on the bookshelf.

Currently contains placeholder files for demonstration:
- example.epub (placeholder)
- example.pdf (placeholder)

The bookshelf expects:
- EPUB files (.epub)
- PDF files (.pdf)

Update the `books.json` file to reference your books:
```json
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "file": "books/your-book.epub",
    "color": "#hexcolor"  // optional
  }
]
```

Books without a "file" field will be displayed as metadata-only and cannot be read online.