/**
 * ANGULAR 19 + MATERIAL 19 QUESTION BUILDER COMPONENT
 *
 * This is a 100% replica of the React component, built as an Angular standalone component
 * that can be used as a dialog/popup.
 *
 * USAGE EXAMPLE:
 */

import { Component, inject } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { QuestionBuilderComponent } from './question-builder.component';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [MatDialogModule],
  template: `
    <button (click)="openQuestionBuilder()">
      Open Question Builder
    </button>
  `
})
export class ExampleComponent {
  private dialog = inject(MatDialog);

  openQuestionBuilder(): void {
    const dialogRef = this.dialog.open(QuestionBuilderComponent, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'fullscreen-dialog',
      data: {} // You can pass initial data here if needed
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed with result:', result);
      // Handle the result here
    });
  }
}

/**
 * APP CONFIG SETUP (for standalone apps):
 *
 * Add this to your app.config.ts:
 */

import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    // ... other providers
  ]
};

/**
 * GLOBAL STYLES SETUP:
 *
 * Add this to your styles.css or styles.scss:
 */

/*
@import '@angular/material/prebuilt-themes/indigo-pink.css';

.fullscreen-dialog .mat-mdc-dialog-container {
  padding: 0;
  border-radius: 0;
}

.fullscreen-dialog {
  max-width: 100vw !important;
  max-height: 100vh !important;
}

.fullscreen-dialog .mat-mdc-dialog-surface {
  border-radius: 0;
}
*/

/**
 * PACKAGE.JSON DEPENDENCIES:
 *
 * Make sure you have these dependencies installed:
 *
 * {
 *   "dependencies": {
 *     "@angular/animations": "^19.0.0",
 *     "@angular/common": "^19.0.0",
 *     "@angular/core": "^19.0.0",
 *     "@angular/forms": "^19.0.0",
 *     "@angular/material": "^19.0.0",
 *     "@angular/cdk": "^19.0.0",
 *     "@angular/platform-browser": "^19.0.0",
 *     "@angular/platform-browser-dynamic": "^19.0.0"
 *   }
 * }
 *
 * Install with:
 * npm install @angular/material @angular/cdk @angular/animations
 */

/**
 * ALTERNATIVELY - MODULE-BASED SETUP:
 *
 * If you're using NgModule instead of standalone:
 */

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    // Your components
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    QuestionBuilderComponent // Import the standalone component
  ],
  providers: [],
  bootstrap: [/* Your root component */]
})
export class AppModule { }

/**
 * FEATURES IMPLEMENTED:
 *
 * ✅ Complete question builder with multi-language support (English, French, Icelandic)
 * ✅ Three question types: Multiple Choice, Written Answer, Decision Tree
 * ✅ Two-step wizard interface (Write Question -> Configure Answers)
 * ✅ Tree navigation panel with collapse/expand functionality
 * ✅ Breadcrumb navigation with dropdown menus
 * ✅ Answer configuration with correct/incorrect marking
 * ✅ Branch questions (nested questions) for decision trees
 * ✅ Link existing questions functionality
 * ✅ Written answer with free-form and specific-format options
 * ✅ Image upload placeholders for questions, hints, and answers
 * ✅ Category and tag management
 * ✅ Hint and feedback message support
 * ✅ Delete questions from tree or breadcrumbs
 * ✅ Click outside to close dropdowns
 * ✅ Resizable tree panel
 * ✅ Full TypeScript type safety
 * ✅ 100% identical styling to the React version
 *
 * NOTES:
 *
 * 1. The component is fully standalone and can be used in any Angular 19+ project
 * 2. All colors match the original (#688cd5 primary color)
 * 3. All animations and transitions are identical
 * 4. The tree structure and navigation logic is preserved
 * 5. Material Icons are used instead of lucide-react icons
 * 6. FormsModule is used for two-way data binding ([(ngModel)])
 *
 * MATERIAL ICON MAPPINGS:
 *
 * React (lucide-react) -> Angular Material Icons:
 * - GitBranch -> account_tree
 * - X -> close
 * - Plus -> add
 * - ChevronDown -> expand_more
 * - Edit -> edit
 * - Home -> home
 * - CheckCircle -> check_circle
 * - Trash2 -> delete
 * - Upload -> upload
 * - Link -> link
 * - Search -> search
 */

export { QuestionBuilderComponent };
