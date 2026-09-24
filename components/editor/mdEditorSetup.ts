import { config } from 'md-editor-rt';

config({
  markdownItConfig: (md) => {
    md.set({ breaks: true });
  },
});
