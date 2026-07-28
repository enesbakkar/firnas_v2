import pathlib, re

root = pathlib.Path(r'C:/Users/enesb/OneDrive/Belgeler/software_projects/first_project')

# Add loading="lazy" to non-hero, non-logo images in HTML files
for html_file in root.rglob('*.html'):
    text = html_file.read_text(encoding='utf-8')
    original = text
    # Add loading="lazy" to img tags that don't already have it and aren't language flags or hero logos
    def add_lazy(m):
        tag = m.group(0)
        if 'loading=' in tag:
            return tag
        # Skip nav logos, language flags, hero background (above-fold critical images)
        if 'firnas_logo.png' in tag or 'flagcdn.com' in tag or 'hero-bg-centered' in tag:
            return tag
        return tag[:-1] + ' loading="lazy">'
    
    text = re.sub(r'<img[^>]+>', add_lazy, text)
    if text != original:
        html_file.write_text(text, encoding='utf-8')
        print(f'Updated: {html_file.relative_to(root)}')
    else:
        print(f'Skipped: {html_file.relative_to(root)}')

print('Done adding lazy loading!')
