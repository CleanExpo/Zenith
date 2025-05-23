import * as AlertDialog from '@radix-ui/react-dialog';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

const AlertDialogComponent = () => (
  <AlertDialog.Root>
    <AlertDialog.Trigger asChild>
      <button className="Button violet">Open Alert Dialog</button>
    </AlertDialog.Trigger>
    <AlertDialog.Portal>
      <AlertDialog.Overlay className="DialogOverlay" />
      <AlertDialog.Content className="DialogContent">
        <AlertDialog.Title className="DialogTitle">Are you sure absolutely sure?</AlertDialog.Title>
        <AlertDialog.Description className="DialogDescription">
          This action cannot be undone. This will permanently delete your account and remove your data from our servers.
        </AlertDialog.Description>
        <div style={{ display: 'flex', gap: 25, justifyContent: 'flex-end' }}>
          <AlertDialog.Cancel asChild>
            <button className="Button green">Cancel</button>
          </AlertDialog.Cancel>
          <AlertDialog.Action asChild>
            <button className="Button red">Yes, delete account</button>
          </AlertDialog.Action>
        </div>
        <AlertDialog.Close asChild>
          <button className="IconButton" aria-label="Close">
<ExclamationTriangleIcon className="CloseIcon" />
            <span className="sr-only">Close</span>
          </button>
        </AlertDialog.Close>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  </AlertDialog.Root>
);

export default AlertDialogComponent;
