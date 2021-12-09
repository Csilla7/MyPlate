const { DELETED_USER_EMAIL, DELETED_USER_PWD } = process.env;

const deletedUserData = {
  username: 'unknown chef',
  isDeleted: true,
  email: DELETED_USER_EMAIL,
  password: DELETED_USER_PWD,
  intro: '',
  favorites: [],
};

export default deletedUserData;
