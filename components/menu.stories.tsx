import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Menu from './menu';

export default {
  title: 'Menu',
  component: Menu,
} as ComponentMeta<typeof Menu>;

const Template: ComponentStory<typeof Menu> = () => (
  <div className="bg-white px-2 py-10">
    <Menu />
  </div>
);
export const Default = Template.bind({});
Default.args = {};
