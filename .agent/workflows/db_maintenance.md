---
description: Backup the production database
---

1. Create functionality to backup database
// turbo
2. cp backend/db/database.sqlite backend/db/backup_$(date +%Y%m%d_%H%M%S).sqlite

3. List recent backups
// turbo
4. ls -lh backend/db/backup_*.sqlite
