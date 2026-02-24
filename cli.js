#!/usr/bin/env node

/**
 * URL Comparison Tool - CLI
 * Professional command-line interface for comparing development and production URLs
 */

const { Command } = require('commander');
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const fs = require('fs').promises;
const path = require('path');
const { analyzeURLs, generateReport, checkThresholds } = require('./cli-utils');

const program = new Command();

program
  .name('url-compare')
  .description('Professional URL comparison tool for dev and production environments')
  .version('1.0.0');

program
  .command('compare')
  .description('Compare two URLs (dev and production)')
  .requiredOption('-d, --dev <url>', 'Development URL')
  .requiredOption('-p, --prod <url>', 'Production URL')
  .option('-o, --output <file>', 'Output file path (JSON)', './comparison-result.json')
  .option('-f, --format <type>', 'Output format: json, html, pdf', 'json')
  .option('-c, --config <file>', 'Configuration file path', './.compare-config.json')
  .option('--lighthouse', 'Run Lighthouse analysis', false)
  .option('--links', 'Analyze all links', false)
  .option('--visual', 'Visual regression testing', false)
  .option('--resources', 'Track all static resources', true)
  .option('--mobile', 'Use mobile viewport', false)
  .option('--screenshot', 'Capture screenshots', false)
  .option('--verbose', 'Verbose output', false)
  .action(async (options) => {
    console.log('🚀 Starting URL comparison...\n');
    
    try {
      // Load configuration if exists
      let config = {};
      try {
        const configContent = await fs.readFile(options.config, 'utf-8');
        config = JSON.parse(configContent);
        if (options.verbose) console.log('✓ Configuration loaded from', options.config);
      } catch (err) {
        if (options.verbose) console.log('ℹ No configuration file found, using defaults');
      }

      // Merge CLI options with config
      const analysisOptions = {
        devUrl: options.dev,
        prodUrl: options.prod,
        lighthouse: options.lighthouse || config.features?.lighthouse,
        linkAnalysis: options.links || config.features?.linkAnalysis,
        visualRegression: options.visual || config.features?.visualRegression,
        resourceTracking: options.resources !== false && config.features?.resourceTracking !== false,
        mobile: options.mobile || config.viewport?.isMobile,
        screenshot: options.screenshot,
        viewport: config.viewport || (options.mobile ? {
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
          isMobile: true
        } : {
          width: 1920,
          height: 1080,
          deviceScaleFactor: 1,
          isMobile: false
        }),
        auth: config.auth,
        verbose: options.verbose
      };

      // Run analysis
      const results = await analyzeURLs(analysisOptions);

      // Check thresholds and generate alerts
      const alerts = checkThresholds(results, config.alerts?.thresholds || {});
      results.alerts = alerts;

      // Display alerts
      if (alerts.length > 0) {
        console.log('\n⚠️  Alerts:\n');
        alerts.forEach(alert => {
          const icon = alert.type === 'error' ? '❌' : alert.type === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`${icon} [${alert.category}] ${alert.message}`);
        });
      }

      // Generate output
      const outputPath = path.resolve(options.output);
      
      if (options.format === 'json') {
        await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
        console.log('\n✅ Results saved to:', outputPath);
      } else if (options.format === 'html') {
        const htmlReport = generateReport(results, 'html');
        const htmlPath = outputPath.replace(/\.json$/, '.html');
        await fs.writeFile(htmlPath, htmlReport);
        console.log('\n✅ HTML report saved to:', htmlPath);
      } else if (options.format === 'pdf') {
        // PDF generation will be handled by the generateReport function
        const pdfPath = outputPath.replace(/\.json$/, '.pdf');
        await generateReport(results, 'pdf', pdfPath);
        console.log('\n✅ PDF report saved to:', pdfPath);
      }

      // Save to history
      await saveToHistory(results);

      // Exit with appropriate code
      const hasErrors = alerts.some(a => a.type === 'error');
      process.exit(hasErrors ? 1 : 0);

    } catch (error) {
      console.error('❌ Error:', error.message);
      if (options.verbose) console.error(error.stack);
      process.exit(1);
    }
  });

program
  .command('history')
  .description('View comparison history')
  .option('-l, --limit <number>', 'Number of results to show', '10')
  .option('--clear', 'Clear all history', false)
  .action(async (options) => {
    try {
      const historyPath = path.join(process.cwd(), '.comparison-history.json');
      
      if (options.clear) {
        await fs.writeFile(historyPath, JSON.stringify([], null, 2));
        console.log('✅ History cleared');
        return;
      }

      const historyContent = await fs.readFile(historyPath, 'utf-8');
      const history = JSON.parse(historyContent);
      
      const limit = parseInt(options.limit);
      const recentHistory = history.slice(-limit).reverse();

      console.log(`\n📊 Recent Comparisons (${recentHistory.length}):\n`);
      recentHistory.forEach((item, index) => {
        const date = new Date(item.timestamp).toLocaleString();
        const alertCount = item.alerts?.length || 0;
        console.log(`${index + 1}. ${date}`);
        console.log(`   Dev: ${item.devUrl}`);
        console.log(`   Prod: ${item.prodUrl}`);
        console.log(`   Alerts: ${alertCount}`);
        console.log('');
      });

    } catch (error) {
      console.error('❌ Error reading history:', error.message);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize configuration file')
  .action(async () => {
    const configTemplate = {
      devUrl: "https://dev.example.com",
      prodUrl: "https://example.com",
      viewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        isMobile: false
      },
      alerts: {
        enabled: true,
        thresholds: {
          htmlSizeDiff: 20,
          scriptCountDiff: 5,
          imageCountDiff: 10,
          performanceScoreDiff: 10,
          brokenLinksMax: 0,
          lighthousePerformanceMin: 80
        },
        notifyOn: ["error", "warning"]
      },
      features: {
        lighthouse: true,
        linkAnalysis: true,
        visualRegression: true,
        resourceTracking: true
      }
    };

    const configPath = path.join(process.cwd(), '.compare-config.json');
    await fs.writeFile(configPath, JSON.stringify(configTemplate, null, 2));
    console.log('✅ Configuration file created:', configPath);
    console.log('\nEdit this file to customize your comparison settings.');
  });

program
  .command('crawl')
  .description('Crawl and compare multiple pages from sitemap')
  .requiredOption('-d, --dev <url>', 'Development sitemap URL')
  .requiredOption('-p, --prod <url>', 'Production sitemap URL')
  .option('-l, --limit <number>', 'Maximum number of pages to compare', '10')
  .option('-o, --output <dir>', 'Output directory', './crawl-results')
  .action(async (options) => {
    console.log('🕷️  Starting multi-page crawl...\n');
    
    try {
      const { crawlAndCompare } = require('./cli-utils');
      const results = await crawlAndCompare({
        devSitemapUrl: options.dev,
        prodSitemapUrl: options.prod,
        limit: parseInt(options.limit),
        outputDir: options.output
      });

      console.log('\n✅ Crawl completed!');
      console.log(`   Pages analyzed: ${results.completed}`);
      console.log(`   Failed: ${results.failed}`);
      console.log(`   Results saved to: ${options.output}`);

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

async function saveToHistory(results) {
  try {
    const historyPath = path.join(process.cwd(), '.comparison-history.json');
    let history = [];
    
    try {
      const content = await fs.readFile(historyPath, 'utf-8');
      history = JSON.parse(content);
    } catch (err) {
      // File doesn't exist yet
    }

    const historyEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      devUrl: results.devUrl,
      prodUrl: results.prodUrl,
      results: {
        dom: results.dom,
        seo: results.seo,
        performance: results.performance,
        lighthouse: results.lighthouse,
        links: results.links,
        resources: results.resources
      },
      alerts: results.alerts || [],
      visualDiff: results.visualDiff
    };

    history.push(historyEntry);

    // Keep only last 100 entries
    if (history.length > 100) {
      history = history.slice(-100);
    }

    await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Warning: Could not save to history:', error.message);
  }
}

program.parse();
