import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { warning } from 'react-notification-system-redux';

import Input from '../../Common/Input';
import Button from '../../Common/Button';

const AddMessage = props => {
  const dispatch = useDispatch();
  const { onSubmit } = props;
  const [message, setMessage] = useState('');

  const handleOnSubmit = e => {
    e.preventDefault();
    if (!message.trim()) {
      return dispatch(warning({ title: 'Please type message.', position: 'tr', autoDismiss: 3 }));
    }
    onSubmit(message);
    setMessage('');
  };

  return (
    <form onSubmit={handleOnSubmit}>
      <Input
        autoComplete='off'
        type={'text'}
        name={'message'}
        placeholder='type message'
        value={message}
        onInputChange={(_, value) => setMessage(value)}
        inlineElement={<SendButton disabled={!message} />}
      />
    </form>
  );
};

const SendButton = ({ disabled }) => (
  <Button type='submit' disabled={disabled} variant='primary' text='Send' />
);

export default AddMessage;
