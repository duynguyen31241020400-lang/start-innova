const { supabaseAdmin } = require('../config/supabase');

const rsvpEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user.id;

    const { data: ev, error: e1 } = await supabaseAdmin
      .from('site_events')
      .select('id')
      .eq('id', eventId)
      .eq('is_published', true)
      .single();

    if (e1 || !ev) {
      return res.status(404).json({ error: 'Không tìm thấy sự kiện.' });
    }

    const { error } = await supabaseAdmin.from('event_rsvps').insert({ event_id: eventId, user_id: userId });

    if (error) {
      if (error.code === '23505') {
        return res.status(200).json({ message: 'Bạn đã đăng ký sự kiện này rồi.' });
      }
      throw error;
    }

    res.status(201).json({ message: 'Đã đăng ký tham gia sự kiện.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const cancelRsvp = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user.id;

    await supabaseAdmin.from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', userId);

    res.json({ message: 'Đã hủy đăng ký.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const myRsvpIds = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabaseAdmin.from('event_rsvps').select('event_id').eq('user_id', userId);

    if (error) {
      throw error;
    }

    res.json({ eventIds: (data || []).map((r) => r.event_id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { rsvpEvent, cancelRsvp, myRsvpIds };
