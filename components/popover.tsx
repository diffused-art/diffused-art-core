import { Popover as HeadlessUiPopover, Transition } from '@headlessui/react';
import { ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePopper } from 'react-popper';

interface PopoverProps {
  children: ReactNode;
  panelContent: ReactNode;
  disabled?: boolean;
  placement?:
    | 'auto'
    | 'auto-start'
    | 'auto-end'
    | 'top'
    | 'bottom'
    | 'right'
    | 'left'
    | 'top-start'
    | 'top-end'
    | 'bottom-start'
    | 'bottom-end'
    | 'right-start'
    | 'right-end'
    | 'left-start'
    | 'left-end';
}

export default function Popover({
  children,
  panelContent,
  disabled,
  placement = 'auto',
}: PopoverProps) {
  let [referenceElement, setReferenceElement] = useState();
  let [popperElement, setPopperElement] = useState();
  let { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement,
  });
  const [isShowing, setIsShowing] = useState(false);
  const shouldShow = !disabled && isShowing;

  return (
    <HeadlessUiPopover className="relative">
      <div
        ref={setReferenceElement as any}
        onMouseEnter={() => setIsShowing(true)}
        onMouseLeave={() => setIsShowing(false)}
      >
        {children}
      </div>

      <Transition
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
        show={shouldShow}
        onMouseEnter={() => setIsShowing(true)}
        onMouseLeave={() => setIsShowing(false)}
      >
        {createPortal(
          <HeadlessUiPopover.Panel
            ref={setPopperElement as any}
            style={styles.popper}
            {...attributes.popper}
            className="!z-50 shadow-lg shadow-yellow-50/50 rounded-md bg-secondary-90 p-10"
          >
            {panelContent}
          </HeadlessUiPopover.Panel>,
          document.body,
        )}
      </Transition>
    </HeadlessUiPopover>
  );
}
