import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Footer from './footer';

export default {
  title: 'Footer',
  component: Footer,
  argsTypes: {
    ctaEnabled: { control: 'boolean' },
    twitterEnabled: { control: 'boolean' },
  },
} as ComponentMeta<typeof Footer>;

const Template: ComponentStory<typeof Footer> = args => <Footer {...args} />;

export const Default = Template.bind({});
Default.args = {
  ctaEnabled: true,
  twitterEnabled: true,
};
