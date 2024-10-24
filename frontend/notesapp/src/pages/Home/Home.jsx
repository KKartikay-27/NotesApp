import React, { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import NoteCard from '../../components/Cards/NoteCard'
import { MdAdd } from 'react-icons/md'
import AddEditNotes from './AddEditNotes'
import Modal from 'react-modal'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../utils/axiosInstance'
import Toast from '../../components/ToastMessage/Toast'
import EmptyCart from '../../components/EmptyCart/EmptyCart'
import AddNoteImg from '../../assets/images/add-note.svg'
import noDataImg from '../../assets/images/no-Data.svg'

const Home = () => {

  const [openAddNoteModal, setOpenAddNoteModal] = useState({
    isShown: false,
    type: "add",
    data: null,
  });


  const [showToastMsg, setShowToastMsg] = useState({
    isShown: false,
    message: "",
    type: "add"
  });

  const [allNotes, setAllNotes] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  const [isSearch, setIsSearch] = useState(false);

  const navigate = useNavigate();

  const handleEdit = (noteDetails) => {
    setOpenAddNoteModal({ isShown: true, type: 'edit', data: noteDetails });
  };

  const showToastMessage = (message, type) => {
    setShowToastMsg({
      isShown: true,
      message,
      type
    });
    console.log(showToastMessage);
  };

  const handleCloseToast = () => {
    setShowToastMsg({
      isShown: false,
      message: "",
    });
  };

  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get('/get-user');
      if (response.data && response.data.user) {
        setUserInfo(response.data.user);
      }
    } catch (error) {
      if (error.response.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    };
  }

  const getAllNotes = async () => {
    try {
      const response = await axiosInstance.get('/get-all-notes');
      if (response.data && response.data.notes) {
        setAllNotes(response.data.notes);
      }
    } catch (error) {
      console.log("An unexpected error occurred. Please try again.");
    };
  };

  const deleteNote = async (data) => {

    try {
      const noteId = data._id;

      const response = await axiosInstance.delete('/delete-note/' + noteId);

      if (response.data && !response.data.error) {
        showToastMessage("Note Deleted Successfully", 'delete');
        getAllNotes();
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        console.log("An unexpected error occurred. Please try again.");
      }
    }


  }

  const onSearchNote = async (query) => {
    try {
      const response = await axiosInstance.get('/search-notes', { params: { query } });
      if (response.data && response.data.notes) {
        setIsSearch(true);
        setAllNotes(response.data.notes);
      }
    } catch (error) {
      console.log("An unexpected error occurred. Please try again.");
    };
  }

  const handleClearSearch = async () => {
    setIsSearch(false);
    getAllNotes();
  }

  const updateIsPinned = async (noteData) => {
    const noteId = noteData._id;

    try {
      const response = await axiosInstance.put('/update-note-pinned/' + noteId, { isPinned: !noteData.isPinned });
      if (response.data && response.data.note) {
        showToastMessage(noteData.isPinned ? "Note Unpinned Successfully" : "Note Pinned Successfully");
        getAllNotes();
      }
    }
    catch (error) {
      console.log("An unexpected error occurred. Please try again.");
    }
  }

  useEffect(() => {
    getAllNotes();
    getUserInfo();
    return () => { }
  }, [])


  return (
    <>
      <Navbar userInfo={userInfo} onSearchNote={onSearchNote} handleClearSearch={handleClearSearch} />

      <div className='container mx-auto'>
        {allNotes.length > 0 ? <div className='grid grid-cols-3 gap-4 mt-8 '>
          {allNotes.map((item, index) => (
            <NoteCard
              key={item._id}
              title={item.title}
              date={item.createdOn}
              content={item.content}
              tags={item.tags}
              isPinned={item.isPinned}
              onEdit={() => handleEdit(item)}
              onDelete={() => deleteNote(item)}
              onPinNote={() => updateIsPinned(item)} />
          ))}
        </div> : <EmptyCart
          imgSrc={isSearch ? noDataImg : AddNoteImg}
          message={isSearch ? "Oops ! No notes found for matching your search query." : "Start creating your first note ! Click the '+' button to jot down your ideas, thoughts, ideas nad reminders. Let's get started. !"} />}
      </div>

      <button className='w-16 h-16 flex items-center justify-center rounded-2xl bg-primary hover:bg-blue-600 absolute right-10 bottom-10 '
        onClick={() => {
          setOpenAddNoteModal({ isShown: true, type: 'add', data: null });
        }}>
        <MdAdd className='text-[32px] text-white' />
      </button>

      <Modal isOpen={openAddNoteModal.isShown} onRequestClose={() => { }}
        style={{
          overlay: {
            backgroundColor: 'rgba(0,0,0,0.2)',
          }
        }}
        contentLabel=""
        className='w-[40%] max-h-3/4 bg-white rounded-md mx-auto mt-14 p-5 overflow-scroll'>

        <AddEditNotes
          type={openAddNoteModal.type}
          noteData={openAddNoteModal.data}
          onClose={() => {
            setOpenAddNoteModal({ isShown: false, type: 'add', data: null });
          }}
          getAllNotes={getAllNotes}
          showToastMessage={showToastMessage}
        />
      </Modal>

      <Toast
        isShown={showToastMsg.isShown}
        message={showToastMsg.message}
        type={showToastMsg.type}
        onClose={handleCloseToast}
      />

    </>
  )
}

export default Home;