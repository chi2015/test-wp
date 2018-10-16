import React from 'react';
import ReactDOM from 'react-dom';
import { message, Table, Divider, Button, Modal, Form, Input, InputNumber, Select } from 'antd';
import "antd/dist/antd.min.css";

import { createStore, bindActionCreators } from 'redux';
import { Provider, connect } from 'react-redux';

/*--- COMPONENTS ---*/
class App extends React.Component {
constructor() {
    super();
    this.onUnload = this.onUnload.bind(this);
    this.columns = [
        {
             title: "ID",
             dataIndex: 'id',
             key: 'id'
        },
         {
         title: 'ФИО',
         dataIndex: 'name',
         key: 'name',
       }, {
         title: 'Дата рождения',
         key: 'birthdate',
         render: (record) => (
             <span>{record.birthdate[0]}-{record.birthdate[1] < 10 ? '0'+record.birthdate[1]:record.birthdate[1]}-{record.birthdate[2] < 10 ? '0'+record.birthdate[2]:record.birthdate[2]}</span>
         )
       }, {
         title: 'Адрес',
         dataIndex: 'address',
         key: 'address',
       },
       {
         title: 'Город',
         dataIndex: 'city',
         key: 'city',
       },
       {
         title: 'Телефон',
         render: (record) => (
            <span>+{record.phone.toString().substr(0,1)} ({record.phone.toString().substr(1,3)}) {record.phone.toString().substr(4,3)}-{record.phone.toString().substr(7,2)}-{record.phone.toString().substr(9,2)}</span>
        ),
         key: 'phone',
       },
       {
         title: 'Действие',
         key: 'action',
         render: (record) => (
           <span>
             <a onClick={() => this.editUser(record.id)}>Редактировать</a>
             <Divider type="vertical" />
             <a onClick={() => this.deleteUser(record.id)}>Удалить</a>
           </span>
         ),
       }];
     
  }
  onUnload(event) { // the method that will be used for both add and remove event
    localStorage.setItem('users-data', JSON.stringify(this.props));
  }
  componentDidMount() {
    let isOnIOS = navigator.userAgent.match(/iPad/i)|| navigator.userAgent.match(/iPhone/i);
    let eventName = isOnIOS ? "pagehide" : "beforeunload";
    window.addEventListener(eventName, this.onUnload);
  }
  handleChange(date) {
    message.info('Selected Date: ' + (date ? date.toString() : ''));
    this.props.changeDate(date);
    console.log('props', this.props);
  }
  handleUserCancel() {
    const form = this.formRef.props.form;
    form.resetFields();  
    this.props.hideUserForm();
  }
  handleUserSubmit() {
    const form = this.formRef.props.form;
    form.validateFields((err, values) => {
      if (err) {
        return;
      }
      let user = values;
      user.birthdate = [user.birthyear, user.birthmonth, user.birthday];
      delete user.birthyear;
      delete user.birthmonth;
      delete user.birthday;
      console.log('Received values of form: ', values);
      if (this.props.mode == 'edit') this.props.editUser(this.props.current_id, user);
      else this.props.addUser(values);
      form.resetFields();
      this.props.hideUserForm();
    });
  }
  addUser() {
    this.props.showUserForm('create');
  }
  editUser(id) {
      this.props.showUserForm('edit', id);
  }
  deleteUser(id) {
      this.props.deleteUser(id);
  }
  saveFormRef = (formRef) => {
    this.formRef = formRef;
  }
  render() {
    return (
        <div style={{ margin: '100px auto' }}>
          <Table style={{margin: '0 20px'}} columns={this.columns} dataSource={this.props.users} />
          <UserForm
            wrappedComponentRef={this.saveFormRef}
            visible={this.props.form_visible}
            user={this.props.current_id? this.props.users.filter(user => user.id === this.props.current_id)[0] : emptyUser}
            last_id={this.props.last_id}
            mode={this.props.mode}
            onCancel={this.handleUserCancel.bind(this)}
            onSubmit={this.handleUserSubmit.bind(this)}
          />
          <Button type="primary" style={{marginLeft: 20}} onClick={this.addUser.bind(this)}>
            Добавить нового пользователя
          </Button>
        </div>
    );
  }
}

const FormItem = Form.Item;

const UserForm = Form.create()(
  class extends React.Component {
    constructor(props) {
        super(props);
        let years = [];
        let days = [];
        for (let y=1900; y<=2000; y++) years.push(y);
        for (let d=1; d<=31; d++) days.push(d);
        this.state = {
            years : years,
            days : days,
            year: this.props.user.birthdate[0],
            month: this.props.user.birthdate[1]
        }
    }
    componentDidMount() {
       
    }
    componentWillReceiveProps(nextProps) { console.log('cwrp', nextProps);
        if (nextProps.user.birthdate[0]!=this.state.year)
            this.handleYearChange(nextProps.user.birthdate[0]);
        if (nextProps.user.birthdate[1]!=this.state.month)
            this.handleMonthChange(nextProps.user.birthdate[1]);    
    }
    handleYearChange(val) {
        this.setState({year: val});
        if (this.state.month == 2) this.changeDays(this.leapYear(val) ? 29 : 28);
    }
    handleMonthChange(val) { console.log('handle month', val);
        this.setState({month: val});
        switch (+val) {
            case 4:
            case 6:
            case 9:
            case 11:
                this.changeDays(30);
                break;
            case 2:
                this.changeDays(this.leapYear(this.state.year) ? 29 : 28);
                break;
            default:
                this.changeDays(31);
            
        }
    }
    leapYear(year)
    {
    return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
    }
    changeDays(cnt) {
        let days = this.state.days;
        console.log(cnt, days.length);
        if (cnt < days.length) days.splice(cnt, days.length - cnt);
        else for (let d=days.length; d<cnt; d++) days.push(d+1);
        this.setState({ days : days});
        console.log('days', days);
    }
    render() {
      const { visible, onCancel, onSubmit, form, mode, user, last_id } = this.props;
      const { getFieldDecorator } = form;
      const Option = Select.Option;
      console.log('props', this.props);


      return (
        <Modal
          visible={visible}
          title={mode == "edit"? "Редактирование пользователя "+ user.id : "Добавление нового пользователя"}
          okText={mode == "edit" ? "Изменить" : "Добавить"}
          onCancel={onCancel}
          onOk={onSubmit}
        >
          <Form layout="vertical">
          <FormItem style={{height: 0, margin: 0, padding: 0}}>
              {getFieldDecorator('key', {
                initialValue: mode == 'edit' ? user.key : [] + (last_id + 1)
              })(
                <Input type="hidden"/>
              )}
            </FormItem>
            <FormItem style={{height: 0, margin: 0, padding: 0}}>
              {getFieldDecorator('id', {
                initialValue: mode== 'edit' ? user.id : last_id + 1
              })(
                <Input type="hidden"/>
              )}
            </FormItem>
            <FormItem label="ФИО">
              {getFieldDecorator('name', {
                rules: [{ required: true, message: 'Введите ФИО', max: 100 }],
                initialValue: user.name
              })(
                <Input />
              )}
            </FormItem>
            <FormItem label="Год рождения">
              {getFieldDecorator('birthyear', {
                rules: [{ required: true, message: 'Введите дату рождения!' }],
                initialValue: user.birthdate[0]
              })(
                <Select onChange={this.handleYearChange.bind(this)}>
                    {this.state.years.map(year => (
                        <Option key={year} value={year}>{year}</Option>
                        ))}
                </Select>
              )}
            </FormItem>
            <FormItem label="Месяц рождения">
              {getFieldDecorator('birthmonth', {
                rules: [{ required: true, message: 'Введите дату рождения!' }],
                initialValue: user.birthdate[1]
              })(
               <Select onChange={this.handleMonthChange.bind(this)}>
                   <Option value="1">Январь</Option>
                   <Option value="2">Февраль</Option>
                   <Option value="3">Март</Option>
                   <Option value="4">Апрель</Option>
                   <Option value="5">Май</Option>
                   <Option value="6">Июнь</Option>
                   <Option value="7">Июль</Option>
                   <Option value="8">Август</Option>
                   <Option value="9">Сентябрь</Option>
                   <Option value="10">Октябрь</Option>
                   <Option value="11">Ноябрь</Option>
                   <Option value="12">Декабрь</Option>
               </Select>
              )}
            </FormItem>
            <FormItem label="День рождения">
              {getFieldDecorator('birthday', {
                rules: [{ required: true, message: 'Введите дату рождения!' }],
                initialValue: user.birthdate[2]
              })(
                <Select>
                    {this.state.days.map(day => (
                        <Option key={day} value={day}>{day}</Option>
                        ))}
                </Select>
              )}
            </FormItem>
            <FormItem label="Адрес">
              {getFieldDecorator('address', {
                initialValue: user.address
              })(
                <Input />
              )}
            </FormItem>
            <FormItem label="Телефон">
              {getFieldDecorator('phone', {
                rules: [{ required: true, message: 'Введите номер телефона!' }],
                initialValue: user.phone
              })(
                
                <InputNumber style={{width: 300}}
      formatter={value => `+${value.toString().substr(0,1)} (${value.toString().substr(1,3)}) ${value.toString().substr(4,3)}-${value.toString().substr(7,2)}-${value.toString().substr(9,2)}`}
      parser={value => value.match(/\d+/g).map(Number).join('')}
    />
              )}
            </FormItem>
            <FormItem label="Город">
              {getFieldDecorator('city', {
                initialValue: user.city
              })(
                <Input />
              )}
            </FormItem>
          </Form>
        </Modal>
      );
    }
  }
);

/*--- DATA FOR STORE ---*/

const data = localStorage.getItem("users-data") ? JSON.parse(localStorage.getItem("users-data")) : {
    users : [
        {
            key: '1',
            id: 1,
            name: 'Михаил',
            birthdate: [1996, 6, 21],
            address: 'Балчуг 2',
            city: 'Москва',
            phone: '79990001122'
          }, {
            key: '2',
            id: 2,
            name: 'Олег',
             birthdate: [1984, 10, 17],
            address: 'Балчуг 2',
            city: 'Москва',
            phone: '70851112233'
          },
          {
            key: '3',
            id: 3,
            name: 'Алексей',
            birthdate: [1986, 2, 16],
            address: 'Ленинский',
            city: 'Москва',
            phone: '71184441122'
          }

    ],
    form_visible : false,
    current_id : 0,
    last_id : 3,
    mode: 'create'
};

const emptyUser = {
    name: '',
    birthdate: [1999,1,31],
    address: '',
    city: '',
    phone: ''
}


/* --- ACTIONS --- */

const actions = {
    changeDate: (date) => {
        return {
            type: 'CHANGE_DATE',
            date: date
        }
    },
    showUserForm: (mode, id) => {
        return {
            type: 'SHOW_USER_FORM',
            mode: mode,
            id: id
        }
    },
    hideUserForm: () => {
        return {
            type: 'HIDE_USER_FORM'
        }
    },
    addUser: (user) => {
        return {
            type: 'ADD_USER',
            user: user
        }
    },
    editUser: (id, user) => {
        return {
            type: 'EDIT_USER',
            id: id,
            user: user
        }
    },
    deleteUser: (id) => {
        return {
            type: 'DELETE_USER',
            id: id
        }
    } 
}

/* --- REDUCERS --- */

function reducer(state = data, action) {
    let users = state.users;
    switch (action.type) {
        case 'CHANGE_DATE':
            return {...state, calendar_date: action.date};
        case 'SHOW_USER_FORM':
            return {...state, mode: action.mode, current_id: +action.id || 0, form_visible : true}
        case 'HIDE_USER_FORM':
            return {...state, mode: 'create', current_id: 0, form_visible : false}
        case 'ADD_USER':
            let last_id = state.last_id + 1;
            users.push(action.user);
            return {...state, users: users, last_id: last_id};
        case 'EDIT_USER':
            users.forEach((user, index) => {
                console.log('action.id', action.id, 'user.id', user.id);
                if (+action.id === user.id) users[index] = action.user;
            });
            console.log('users', users);
            return {...state, users: users};
        case 'DELETE_USER':
            return {...state, users: users.filter(user => user.id!=+action.id)};
    }

    return state;
}

/*--- STORE ---*/

const store = createStore(reducer, data);

const AppContainer = connect(
    function mapStateToProps(state) {
        console.log('state to props', state);
        return state;
    },
    function mapDispatchToProps(dispatch) {
        console.log('dispatch to props', dispatch);
        return bindActionCreators(actions, dispatch);
    }
)(App);


ReactDOM.render(<Provider store={store}>
    <AppContainer/>
</Provider>, 
document.getElementById('app'));