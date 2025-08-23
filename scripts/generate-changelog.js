#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Generate changelog entry based on git commits since last version
 */
class ChangelogGenerator {
  constructor() {
    this.commitTypes = {
      feat: 'Added',
      add: 'Added',
      feature: 'Added',
      fix: 'Fixed',
      bugfix: 'Fixed',
      patch: 'Fixed',
      docs: 'Documentation',
      doc: 'Documentation',
      style: 'Changed',
      refactor: 'Changed',
      perf: 'Changed',
      test: 'Testing',
      chore: 'Maintenance',
      build: 'Maintenance',
      ci: 'Maintenance',
      remove: 'Removed',
      delete: 'Removed',
      breaking: 'Breaking Changes'
    };
  }

  /**
   * Get the last version tag from git
   */
  getLastVersionTag() {
    try {
      const tags = execSync('git tag --sort=-version:refname', { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(tag => tag.match(/^v?\d+\.\d+\.\d+$/));
      
      return tags[0] || null;
    } catch (error) {
      console.log('No previous version tags found');
      return null;
    }
  }

  /**
   * Get commits since last version
   */
  getCommitsSinceLastVersion(lastTag) {
    try {
      const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
      const commits = execSync(
        `git log ${range} --pretty=format:"%H|%s|%an|%ae|%ad" --date=short --no-merges`,
        { encoding: 'utf8' }
      )
        .trim()
        .split('\n')
        .filter(line => line.length > 0)
        .map(line => {
          const [hash, subject, author, email, date] = line.split('|');
          return { hash, subject, author, email, date };
        });
      
      return commits;
    } catch (error) {
      console.error('Error getting commits:', error.message);
      return [];
    }
  }

  /**
   * Categorize commit based on its message
   */
  categorizeCommit(commitMessage) {
    const message = commitMessage.toLowerCase();
    
    // Check for conventional commit format (type: description)
    const conventionalMatch = message.match(/^(\w+)(\(.+\))?:\s*(.+)$/);
    if (conventionalMatch) {
      const type = conventionalMatch[1];
      return this.commitTypes[type] || 'Changed';
    }
    
    // Check for keywords in commit message
    for (const [keyword, category] of Object.entries(this.commitTypes)) {
      if (message.includes(keyword)) {
        return category;
      }
    }
    
    // Default categorization based on common patterns
    if (message.includes('add') || message.includes('new') || message.includes('implement')) {
      return 'Added';
    }
    if (message.includes('fix') || message.includes('bug') || message.includes('issue')) {
      return 'Fixed';
    }
    if (message.includes('update') || message.includes('change') || message.includes('improve')) {
      return 'Changed';
    }
    if (message.includes('remove') || message.includes('delete')) {
      return 'Removed';
    }
    if (message.includes('doc') || message.includes('readme')) {
      return 'Documentation';
    }
    
    return 'Changed'; // Default category
  }

  /**
   * Format commit message for changelog
   */
  formatCommitMessage(commit) {
    let message = commit.subject;
    
    // Remove conventional commit prefix if present
    message = message.replace(/^\w+(\(.+\))?:\s*/, '');
    
    // Capitalize first letter
    message = message.charAt(0).toUpperCase() + message.slice(1);
    
    // Add period if not present
    if (!message.endsWith('.') && !message.endsWith('!') && !message.endsWith('?')) {
      message += '.';
    }
    
    return message;
  }

  /**
   * Group commits by category
   */
  groupCommitsByCategory(commits) {
    const grouped = {
      'Added': [],
      'Changed': [],
      'Fixed': [],
      'Removed': [],
      'Documentation': [],
      'Testing': [],
      'Maintenance': [],
      'Breaking Changes': []
    };
    
    commits.forEach(commit => {
      const category = this.categorizeCommit(commit.subject);
      const formattedMessage = this.formatCommitMessage(commit);
      
      grouped[category].push({
        message: formattedMessage,
        hash: commit.hash.substring(0, 7),
        author: commit.author,
        date: commit.date
      });
    });
    
    return grouped;
  }

  /**
   * Generate changelog entry for a version
   */
  generateChangelogEntry(version, commits) {
    const date = new Date().toISOString().split('T')[0];
    const grouped = this.groupCommitsByCategory(commits);
    
    let entry = `## [${version}] - ${date}\n\n`;
    
    // Order of sections
    const sectionOrder = [
      'Breaking Changes',
      'Added', 
      'Changed', 
      'Fixed', 
      'Removed',
      'Documentation',
      'Testing',
      'Maintenance'
    ];
    
    sectionOrder.forEach(section => {
      if (grouped[section].length > 0) {
        entry += `### ${section}\n\n`;
        grouped[section].forEach(item => {
          entry += `- ${item.message}\n`;
        });
        entry += '\n';
      }
    });
    
    // Add contributors section if there are multiple contributors
    const contributors = [...new Set(commits.map(c => c.author))];
    if (contributors.length > 1) {
      entry += `### Contributors\n\n`;
      contributors.forEach(contributor => {
        entry += `- ${contributor}\n`;
      });
      entry += '\n';
    }
    
    return entry;
  }

  /**
   * Update CHANGELOG.md file
   */
  updateChangelog(version, changelogEntry) {
    const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
    
    let content = '';
    if (fs.existsSync(changelogPath)) {
      content = fs.readFileSync(changelogPath, 'utf8');
    } else {
      content = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
    }
    
    // Insert new entry after the header
    const lines = content.split('\n');
    const headerEndIndex = lines.findIndex(line => line.trim() === '') + 1;
    
    lines.splice(headerEndIndex, 0, changelogEntry);
    
    fs.writeFileSync(changelogPath, lines.join('\n'));
    console.log(`✅ Updated CHANGELOG.md with version ${version}`);
  }

  /**
   * Main function to generate changelog
   */
  generate(newVersion) {
    console.log(`🔍 Generating changelog for version ${newVersion}...`);
    
    const lastTag = this.getLastVersionTag();
    console.log(`📋 Last version tag: ${lastTag || 'none'}`);
    
    const commits = this.getCommitsSinceLastVersion(lastTag);
    console.log(`📝 Found ${commits.length} commits since last version`);
    
    if (commits.length === 0) {
      console.log('⚠️  No commits found since last version. Creating minimal changelog entry.');
      const entry = `## [${newVersion}] - ${new Date().toISOString().split('T')[0]}\n\n### Changed\n\n- Version bump to ${newVersion}.\n\n`;
      this.updateChangelog(newVersion, entry);
      return;
    }
    
    const changelogEntry = this.generateChangelogEntry(newVersion, commits);
    this.updateChangelog(newVersion, changelogEntry);
    
    console.log('✨ Changelog generation completed!');
  }
}

// CLI usage
if (require.main === module) {
  const version = process.argv[2];
  if (!version) {
    console.error('❌ Please provide a version number');
    console.log('Usage: node generate-changelog.js <version>');
    process.exit(1);
  }
  
  const generator = new ChangelogGenerator();
  generator.generate(version);
}

module.exports = ChangelogGenerator;